package core

import (
	"encoding/json"
	"fmt"
	"sync"
	"sync/atomic"
)

type capabilityResponse struct {
	result []byte
	err    error
}

var nextCapabilityID atomic.Uint64
var pendingCapabilities sync.Map

func CallCapability(name string, request, result any) error {
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("encode capability %q request: %w", name, err)
	}
	id := nextCapabilityID.Add(1)
	response := make(chan capabilityResponse, 1)
	pendingCapabilities.Store(id, response)
	if err := dispatchCapability(id, name, string(requestJSON)); err != nil {
		pendingCapabilities.Delete(id)
		return err
	}
	value := <-response
	if value.err != nil {
		return value.err
	}
	if result == nil {
		return nil
	}
	if err := json.Unmarshal(value.result, result); err != nil {
		return fmt.Errorf("decode capability %q result: %w", name, err)
	}
	return nil
}

func ResolveCapability(id uint64, result, errorMessage string) {
	value, ok := pendingCapabilities.LoadAndDelete(id)
	if !ok {
		return
	}
	response := capabilityResponse{result: []byte(result)}
	if errorMessage != "" {
		response.err = fmt.Errorf("capability failed: %s", errorMessage)
	}
	value.(chan capabilityResponse) <- response
}

func RejectPendingCapabilities(errorMessage string) {
	pendingCapabilities.Range(func(key, value any) bool {
		if _, loaded := pendingCapabilities.LoadAndDelete(key); loaded {
			value.(chan capabilityResponse) <- capabilityResponse{err: fmt.Errorf("capability failed: %s", errorMessage)}
		}
		return true
	})
}
