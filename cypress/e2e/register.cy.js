describe('Register happy path', () => {
  beforeEach(() => {
    // Load the shared user shapes once per test; `this.users` is then available
    // in the `function () {}` test body below.
    cy.fixture('users').as('users')
  })

  it('registers a new user and lands them on an authenticated page', function () {
    const { name, password } = this.users.registrant

    // Unique per run: the server DB persists between runs, so a fixed email
    // would pass once then fail with "email already taken". A fresh address
    // keeps the spec deterministic and rerunnable without DB cleanup. Only the
    // email varies per run, so it stays inline rather than in the fixture.
    const email = `register-${Date.now()}@example.com`

    cy.visit('/register')

    cy.get('input[name=name]').type(name)
    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type(password)
    cy.get('input[name=password_confirmation]').type(password)
    cy.get('[data-test=register-user-button]').click()

    // Cypress asserts user-observable success, not internal config. A valid
    // registration authenticates the user and redirects to Fortify's home
    // (/dashboard). If MustVerifyEmail is later enabled on the User model, the
    // same flow lands on /verify-email instead. Both are legitimate
    // authenticated destinations, so the spec accepts either — robust to that
    // toggle without inspecting server config. A failed registration would
    // stay on /register and fail this assertion.
    cy.url().should('match', /\/(dashboard|verify-email)(\?|$)/)
  })
})
