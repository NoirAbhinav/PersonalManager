package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

type GeminiClient struct {
	client *genai.Client
	model  string
}

func NewGeminiClient(apiKey string) (*GeminiClient, error) {

	client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})

	if err != nil {
		return nil, err
	}

	return &GeminiClient{
		client: client,
		model:  "gemini-2.5-flash",
	}, nil
}

func (g *GeminiClient) GenerateText(
	ctx context.Context,
	prompt string,
) (string, error) {

	resp, err := g.client.Models.GenerateContent(
		ctx,
		g.model,
		genai.Text(prompt),
		nil,
	)

	if err != nil {
		return "", err
	}

	if resp == nil || resp.Text() == "" {
		return "", fmt.Errorf("empty response from gemini")
	}

	return resp.Text(), nil
}
