import swagger from "@elysiajs/swagger";

export const swaggerEndpoint = swagger({
  path: "/",
  scalarConfig: {
    theme: "mars",
    darkMode: true,
    customCss: "",
    favicon: "/favicon.ico",
  },
  documentation: {
    info: {
      title: "Ground Codes API Documentation",
      description: "API documentation for Ground Codes SaaS",
      version: "1.0.0",
    },
    tags: [
      {
        name: "Code",
        description: "Encode & Decode endpoint",
      },
      {
        name: "Health",
        description: "Endpoint to check the health of the server.",
      },
    ],
  },
});
