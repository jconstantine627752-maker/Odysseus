FROM golang:1.22 as build
WORKDIR /src
COPY . .
RUN go build -o /bin/server ./cmd/server
FROM gcr.io/distroless/base-debian12
COPY --from=build /bin/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
