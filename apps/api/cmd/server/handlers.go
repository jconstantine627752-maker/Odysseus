package main
import("encoding/json";"net/http")
 type ChatMessage struct{ Role, Content string }
 type ChatReq struct{ Model string `json:"model"`; Messages []ChatMessage `json:"messages"`; Stream bool `json:"stream"`}
 type ChatResp struct{ Choices []struct{ Message ChatMessage `json:"message"` } `json:"choices"` }
 func ModelsHandler() http.HandlerFunc { return func(w http.ResponseWriter, r *http.Request){ json.NewEncoder(w).Encode(map[string]any{"data": []map[string]string{{"id":"default"}}}) } }
 func ChatCompletionsHandler() http.HandlerFunc { return func(w http.ResponseWriter, r *http.Request){ var req ChatReq; json.NewDecoder(r.Body).Decode(&req); out:=ChatResp{Choices: []struct{Message ChatMessage `json:"message"`}{ {Message: ChatMessage{Role:"assistant", Content:"Hello from Lunar Astral API (replace with LLM provider)."}}, }}; json.NewEncoder(w).Encode(out) } }
