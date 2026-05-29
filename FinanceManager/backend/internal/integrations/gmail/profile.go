package gmail

import "context"

func (s *Service) GetProfile(
	ctx context.Context,
) (string, error) {

	profile, err := s.client.Users.GetProfile("me").Do()

	if err != nil {
		return "", err
	}

	return profile.EmailAddress, nil
}
