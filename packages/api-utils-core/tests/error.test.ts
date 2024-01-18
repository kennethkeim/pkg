import { ApiError, ClientError, ServiceError } from "../src"

describe("Api Errors", () => {
  it("Should extend correct Errors", () => {
    const serviceErr = new ServiceError(500, "Internal Server Error")
    expect(serviceErr).toBeInstanceOf(Error)
    expect(serviceErr).toBeInstanceOf(ServiceError)
    expect(serviceErr).toBeInstanceOf(ApiError)
    expect(serviceErr).not.toBeInstanceOf(ClientError)
  })
})
