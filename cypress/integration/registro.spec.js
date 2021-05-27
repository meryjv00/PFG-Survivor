//Registro - María
var nombre = 'Maria3';
var email = 'maria3@gmail.com';
var pass = 'Chubaca2020';

describe('Registro', () => {

    beforeEach(() => {
        // Abrimos la web
        cy.visit('https://pfg-survivor.netlify.app');
        // Click botón registro
        cy.get('#btn-registro').click();
    });


    it('Validación correcta ', () => {
        // Submit del formulario
        cy.get('#registro').submit();

        // Se muestran los mensajes de validación
        cy.contains('Este campo es obligatorio.');

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Registro correcto', () => {
        // Email
        cy.get('#email').type(email).should('have.value', email);

        // Nombre
        cy.get('#name').type(nombre).should('have.value', nombre);

        // Contraseña
        cy.get('#pass').type(pass).should('have.value', pass);

        // Confirmación contraseña
        cy.get('#confirmPass').type(pass).should('have.value', pass);

        // Submit del formulario
        cy.get('#registro').submit();

        // La url ahora debe contener /home
        cy.url().should('include', '/home');

        // Espera 2s
        cy.wait(2000);

        // Hacemos captura de pantalla
        cy.screenshot();
    });

    it('Correo ya registrado', () => {
        // Email
        cy.get('#email').type('mar@gmail.com').should('have.value', 'mar@gmail.com');

        // Nombre
        cy.get('#name').type('Mar').should('have.value', 'Mar');

        // Contraseña
        cy.get('#pass').type(pass).should('have.value', pass);

        // Confirmación contraseña
        cy.get('#confirmPass').type(pass).should('have.value', pass);

        // Submit del formulario
        cy.get('#registro').submit();

        // Alerta correo ya registrado
        cy.contains('El correo electrónico introducido ya está registrado.');

        // Hacemos captura de pantalla
        cy.screenshot();
    });


});