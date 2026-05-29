package app

import (
	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func setupMiddleware(cfg *config.Config, r *gin.Engine) {

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			cfg.FrontendURL,
			"http://localhost:3000",
		},

		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},

		AllowHeaders: []string{
			"Content-Type",
			"Authorization",
		},

		ExposeHeaders: []string{
			"Content-Length",
			"Location",
		},

		AllowCredentials: true,
		MaxAge:           86400,
	}))
}
