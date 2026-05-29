package app

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func setupMiddleware(r *gin.Engine) {

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
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
