declare class OdinServer {
    private app;
    private config;
    private healthRouter;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private initializeServices;
    start(): Promise<void>;
    private gracefulShutdown;
}
export { OdinServer };
//# sourceMappingURL=server.d.ts.map