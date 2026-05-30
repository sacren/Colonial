describe('Welcome page', () => {
  it('loads and shows the welcome heading', () => {
    cy.visit('/')
    cy.contains('h1', "Let's get started").should('be.visible')
  })

  it('links Log in to /login and Register to /register', () => {
    cy.visit('/')
    cy.contains('a', 'Log in').should('have.attr', 'href').and('include', '/login')
    cy.contains('a', 'Register').should('have.attr', 'href').and('include', '/register')
  })
})
