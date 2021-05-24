//Login - María
var emailValido = 'pepe@gmail.com';
var emailInvalido = 'pepito@gmail.com';

describe('Contraseña olvidada', () => {

    beforeEach(() => {
        // Abrimos la web
        cy.visit('https://pfg-survivor.netlify.app');
        // Click botón registro
        cy.get('#btn-login').click();
        // Click he olvidado la contraseña
        cy.get('#forgotPass').click();
    });

    it('Validación correcta', () => {
        // Submit del formulario
        cy.get('#passOlvidada').submit();

        // Se muestran los mensajes de validación
        cy.contains('Este campo es obligatorio.');

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Correo enviado correctamente', () => {
        // Espera 1s
        cy.wait(1000);

        // Email
        cy.get('#email').type(emailValido).should('have.value', emailValido);

        // Submit del formulario
        cy.get('#passOlvidada').submit();

        // Alerta email enviado correctamente
        cy.contains('Se ha enviado un mensaje al correo electrónico para restablecer la contraseña.');

        // Espera 1s
        cy.wait(1000);

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Email invalido', () => {
        // Espera 1s
        cy.wait(1000);

        // Email
        cy.get('#email').type(emailInvalido).should('have.value', emailInvalido);

        // Submit del formulario
        cy.get('#passOlvidada').submit();

        // Alerta email no registrado en la aplicación
        cy.contains('No hay ningún usuario registrado con el correo electrónico solicitado.');

        // Espera 1s
        cy.wait(1000);

        // Hacemos captura de pantalla
        cy.screenshot();
    });


});