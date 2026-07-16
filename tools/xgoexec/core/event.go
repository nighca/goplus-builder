package core

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

type EventHandler func(payload json.RawMessage) error

var eventState struct {
	sync.RWMutex
	handlers   map[string]EventHandler
	runContext context.Context
}

// RegisterEventHandler connects a UI-originated event to framework code.
// Handlers should enqueue work for the program goroutine instead of entering the interpreter concurrently.
func RegisterEventHandler(name string, handler EventHandler) {
	eventState.Lock()
	defer eventState.Unlock()
	if eventState.handlers == nil {
		eventState.handlers = make(map[string]EventHandler)
	}
	eventState.handlers[name] = handler
}

// DispatchEvent delivers one JSON event payload to the handler registered by the running project.
func DispatchEvent(name string, payload []byte) error {
	eventState.RLock()
	handler := eventState.handlers[name]
	eventState.RUnlock()
	if handler == nil {
		return fmt.Errorf("event %q has no registered handler", name)
	}
	return handler(payload)
}

// CurrentRunContext lets framework event loops stop with the project runtime.
func CurrentRunContext() context.Context {
	eventState.RLock()
	defer eventState.RUnlock()
	if eventState.runContext == nil {
		return context.Background()
	}
	return eventState.runContext
}

func setCurrentRunContext(ctx context.Context) {
	eventState.Lock()
	defer eventState.Unlock()
	eventState.runContext = ctx
}
