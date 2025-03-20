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
    // 서버 설정 추가
    servers: [
      {
        url: "/",
        description: "Current server"
      }
    ],
    // 전역 매개변수 설정
    components: {
      parameters: {
        path: {
          name: "path",
          in: "path",
          required: true,
          schema: {
            type: "string",
            default: "37.5665,126.9780",
            example: "37.5665,126.9780"
          },
          examples: {
            coordinates: {
              summary: "Coordinates for encoding",
              value: "37.5665,126.9780"
            },
            encodedCode: {
              summary: "Encoded code for decoding",
              value: "seoul-abc123"
            }
          }
        }
      }
    }
  },
  // Swagger UI 사용자 정의 설정
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    filter: true,
    defaultModelRendering: "model"
  }
});
