//Login - María
var pass = 'Chubaca2020';
var emailValido = 'pepe@gmail.com';
var emailInvalido = 'pepito@gmail.com';

describe('Login', () => {
    
    beforeEach(() => {
        // Abrimos la web
        cy.visit('https://pfg-survivor.netlify.app');
        // Click botón login
        cy.get('#btnlogin').click();
    });

    it('Validación correcta', () => {
        // Submit del formulario
        cy.get('#login').submit();

        // Se muestran los mensajes de validación
        cy.contains('Este campo es obligatorio.');

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Login correcto', () => {
        // Email
        cy.get('#email').type(emailValido).should('have.value', emailValido);

        // Contraseña
        cy.get('#pass').type(pass).should('have.value', pass);

        // Submit del formulario
        cy.get('#login').submit();

        // La url ahora debe contener /home
        cy.url().should('include', '/home');

        // Espera 3s
        cy.wait(3000);

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Login incorrecto', () => {
        // Email
        cy.get('#email').type(emailInvalido).should('have.value', emailInvalido);

        // Contraseña
        cy.get('#pass').type(pass).should('have.value', pass);

        // Submit del formulario
        cy.get('#login').submit();

        // Alerta login incorrecto
        cy.contains('No se ha podido iniciar sesión. Revise sus credenciales.');

        // Espera 1s
        cy.wait(1000);

        // Hacemos captura de pantalla
        cy.screenshot();
    });


});