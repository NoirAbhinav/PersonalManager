package app

func (a *App) setup() error {
	cfg := loadConfig()

	deps, err := buildDependencies(cfg)
	if err != nil {
		return err
	}

	router := setupRouter(deps)

	startWorkers(a.ctx, deps)

	a.Config = cfg
	a.Router = router

	return nil
}
