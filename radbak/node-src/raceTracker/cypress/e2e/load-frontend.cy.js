/// <reference types="cypress" />

describe("Test load frontend", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/races");
  });

  it("frontend loads race-list by itself", () => {
    cy.get("#racelist-page").should("exist");
  });

  it("Test api-connection through get-request", () => {
    cy.request({
      url: "http://localhost:80/races", // How can I look for another port?
      method: "GET",
      failOnStatusCode: true,
    });
  });

  it("checks if backend connects and loads base data", () => {
    cy.get("#race-list", { timeout: 10000 }).should("exist");
  });
});
