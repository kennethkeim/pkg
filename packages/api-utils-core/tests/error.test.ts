import { ApiError, ClientError, ServiceError } from "../src"

describe("Api Errors", () => {
  it("Should extend correct Errors", () => {
    const serviceErr = new ServiceError(500, "Internal Server Error")
    expect(serviceErr).toBeInstanceOf(Error)
    expect(serviceErr).toBeInstanceOf(ServiceError)
    expect(serviceErr).toBeInstanceOf(ApiError)
    expect(serviceErr).not.toBeInstanceOf(ClientError)
  })

  it("Should set cause correctly", () => {
    const clientErr = new ClientError()
    expect(clientErr).toBeInstanceOf(Error)
    expect(clientErr).toBeInstanceOf(ApiError)
    clientErr.setCause(new Error("oh no"))
    expect(clientErr.cause).toBeInstanceOf(Error)
  })
})
