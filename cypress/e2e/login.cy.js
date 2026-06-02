describe('Login error path', () => {
  beforeEach(() => {
    // Load the shared user shapes once per test; `this.users` is then available
    // in the `function () {}` test body below.
    cy.fixture('users').as('users')
  })

  it('shows an error when credentials are invalid', function () {
    const { email, password } = this.users.invalid

    cy.visit('/login')

    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type(password)
    cy.get('[data-test=login-button]').click()

    cy.contains('These credentials do not match our records.').should('be.visible')
  })
})
