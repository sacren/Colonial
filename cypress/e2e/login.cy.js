describe('Login error path', () => {
  it('shows an error when credentials are invalid', () => {
    cy.visit('/login')

    cy.get('input[name=email]').type('nobody@example.com')
    cy.get('input[name=password]').type('wrong-password')
    cy.get('[data-test=login-button]').click()

    cy.contains('These credentials do not match our records.').should('be.visible')
  })
})
