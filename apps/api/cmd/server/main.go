package main
import(
  "log"
  "net/http"
  "github.com/rs/cors"
)
func main(){
  mux:=http.NewServeMux()
  mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request){ w.Write([]byte("ok")) })
  mux.HandleFunc("/v1/models", ModelsHandler())
  mux.HandleFunc("/v1/chat/completions", ChatCompletionsHandler())
  h:=cors.AllowAll().Handler(mux)
  log.Println("API listening on :8080")
  log.Fatal(http.ListenAndServe(":8080", h))
}
