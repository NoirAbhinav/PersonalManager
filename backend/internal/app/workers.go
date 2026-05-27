package app

import "context"

func startWorkers(ctx context.Context, deps *Dependencies) {
	go deps.SyncWorker.Start(ctx)
}
