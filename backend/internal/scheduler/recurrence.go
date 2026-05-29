package scheduler

import (
	"encoding/json"
	"fmt"
	"time"
)

type Frequency string

const (
	FrequencyDaily   Frequency = "daily"
	FrequencyWeekly  Frequency = "weekly"
	FrequencyMonthly Frequency = "monthly"
)

type EndType string

const (
	EndTypeNever           EndType = "never"
	EndTypeOnDate          EndType = "on_date"
	EndTypeAfterOccurrence EndType = "after_occurrences"
)

type Schedule struct {
	StartAt        time.Time  `json:"start_at"`
	EndType        EndType    `json:"end_type"`
	EndDate        *time.Time `json:"end_date,omitempty"`
	MaxOccurrences int        `json:"max_occurrences,omitempty"`
	Frequency      Frequency  `json:"frequency"`

	DailyTime string `json:"daily_time,omitempty"`

	WeeklyDays []int  `json:"weekly_days,omitempty"` // plain int, not time.Weekday
	WeeklyTime string `json:"weekly_time,omitempty"`

	MonthlyDay  int    `json:"monthly_day,omitempty"`
	MonthlyTime string `json:"monthly_time,omitempty"`

	Timezone string `json:"timezone"`
}

func ParseSchedule(raw []byte) (*Schedule, error) {
	var s Schedule
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil, err
	}
	return &s, nil
}

// ComputeNextRun returns the next run time after `after`, or zero time if the
// schedule is exhausted. occurrencesRun is the current count before this next run.
func ComputeNextRun(s *Schedule, after time.Time, occurrencesRun int) (time.Time, error) {
	loc, err := time.LoadLocation(s.Timezone)
	if err != nil {
		loc = time.UTC
	}

	after = after.In(loc)

	var next time.Time

	switch s.Frequency {
	case FrequencyDaily:
		next, err = nextDaily(s, after, loc)
	case FrequencyWeekly:
		next, err = nextWeekly(s, after, loc)
	case FrequencyMonthly:
		next, err = nextMonthly(s, after, loc)
	default:
		return time.Time{}, fmt.Errorf("unknown frequency: %s", s.Frequency)
	}

	if err != nil {
		return time.Time{}, err
	}

	// Check end conditions
	switch s.EndType {
	case EndTypeOnDate:
		if s.EndDate != nil && next.After(*s.EndDate) {
			return time.Time{}, nil // exhausted
		}
	case EndTypeAfterOccurrence:
		if occurrencesRun >= s.MaxOccurrences {
			return time.Time{}, nil // exhausted
		}
	}

	// Must not be before start
	if next.Before(s.StartAt) {
		next = s.StartAt
	}

	return next.UTC(), nil
}

func parseHHMM(t string, base time.Time, loc *time.Location) (time.Time, error) {
	var h, m int
	if _, err := fmt.Sscanf(t, "%d:%d", &h, &m); err != nil {
		return time.Time{}, fmt.Errorf("invalid time %q", t)
	}
	return time.Date(base.Year(), base.Month(), base.Day(), h, m, 0, 0, loc), nil
}

func nextDaily(s *Schedule, after time.Time, loc *time.Location) (time.Time, error) {
	candidate, err := parseHHMM(s.DailyTime, after, loc)
	if err != nil {
		return time.Time{}, err
	}
	if !candidate.After(after) {
		candidate = candidate.AddDate(0, 0, 1)
	}
	return candidate, nil
}

func nextWeekly(s *Schedule, after time.Time, loc *time.Location) (time.Time, error) {
	if len(s.WeeklyDays) == 0 {
		return time.Time{}, fmt.Errorf("weekly_days is empty")
	}

	for i := 0; i <= 14; i++ {
		day := after.AddDate(0, 0, i)
		for _, wd := range s.WeeklyDays {
			if int(day.Weekday()) == wd {
				candidate, err := parseHHMM(s.WeeklyTime, day, loc)
				if err != nil {
					return time.Time{}, err
				}
				if candidate.After(after) {
					return candidate, nil
				}
			}
		}
	}

	return time.Time{}, fmt.Errorf("could not compute next weekly run")
}

func nextMonthly(s *Schedule, after time.Time, loc *time.Location) (time.Time, error) {
	day := s.MonthlyDay
	if day < 1 {
		day = 1
	}
	if day > 28 {
		day = 28 // safe max across all months
	}

	// Try this month, then next month
	for i := 0; i <= 2; i++ {
		t := time.Date(after.Year(), after.Month()+time.Month(i), day, 0, 0, 0, 0, loc)
		candidate, err := parseHHMM(s.MonthlyTime, t, loc)
		if err != nil {
			return time.Time{}, err
		}
		if candidate.After(after) {
			return candidate, nil
		}
	}

	return time.Time{}, fmt.Errorf("could not compute next monthly run")
}
