describe('Welcome page', () => {
  it('loads and shows the welcome heading', () => {
    cy.visit('/')
    cy.contains('h1', "Let's get started").should('be.visible')
  })
})
