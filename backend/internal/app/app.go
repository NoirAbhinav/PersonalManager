package app

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/gin-gonic/gin"
)

type App struct {
	Router *gin.Engine
	Config *config.Config

	ctx    context.Context
	cancel context.CancelFunc
}

func New() (*App, error) {
	ctx, cancel := context.WithCancel(context.Background())

	a := &App{
		ctx:    ctx,
		cancel: cancel,
	}

	if err := a.setup(); err != nil {
		return nil, err
	}

	return a, nil
}

func (a *App) Run() error {
	return a.Router.Run(":" + a.Config.Port)
}
