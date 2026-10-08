// prettier-ignore
export const EXAMPLE_URL = "https://user:pass@oo.com:8080/path?name=%E5%BC%A0%E4%B8%89&tags=web&data=%7B%22id%22%3A112%2C%22type%22%3A%22user%22%7D&redirect=https%3A%2F%2Fa.com%3Fredirect%3Dhttps%253A%252F%252Fb.com%252Fcc&back=https%3A%2F%2Fdemo.com%2Fback#s1";

export const SAMPLE_JSON = {
  requestId: "e5f6-7890-abcd",
  timestamp: "2025-01-15T08:30:45.123Z",
  version: "2.1.0",
  success: true,
  code: 200,
  message: "操作成功",
  data: {
    nextUrl: EXAMPLE_URL,
    user: {
      id: 10086,
      username: "pone",
      email: "dev@example.com",
      // prettier-ignore
      avatar: "https://gw.alicdn.com/imgextra/i2/O1CN01hhQIXn1Us1oFuhPkL_!!6000000002572-2-tps-1024-1024.png",
      roles: ["admin", "developer", "reviewer"],
    },
    list: [{ name: "Item 1" }, { name: "Item 2" }, { name: "Item 3" }],
  },
};
