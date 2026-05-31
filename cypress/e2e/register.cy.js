describe('Register happy path', () => {
  it('registers a new user and lands them on an authenticated page', () => {
    // Unique per run: the server DB persists between runs, so a fixed email
    // would pass once then fail with "email already taken". A fresh address
    // keeps the spec deterministic and rerunnable without DB cleanup.
    const email = `register-${Date.now()}@example.com`

    cy.visit('/register')

    cy.get('input[name=name]').type('Test User')
    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type('Password123!')
    cy.get('input[name=password_confirmation]').type('Password123!')
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
