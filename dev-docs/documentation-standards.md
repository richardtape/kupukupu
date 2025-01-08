# Documentation For KupuKupu

This document will describe documentation for two different audiences:

1. The developer audience
2. The user audience

## Developer Audience

-   KupuKupu is written using Vanilla JavaScript. There will be no TypeScript. No frameworks will be used. i.e. no React, Vue, Angular, etc.
-   KupuKupu uses vanilla CSS. Modern CSS is excellent. We will target modern browsers. No frameworks will be used.
-   KupuKupu uses vanilla, semantic, accessible HTML. No frameworks will be used.
-   KupuKupu has multiple runtime environments:
    a. A browser, both in a development environment, and in a staging/production environment published to a server.
    b. An Electron app, both in a development environment and in a fully built published application.
    And as such, the code should be written to be compatible with all of these environments.

### Code Documentation

-   All files should have a comment at the top of the file that describes what the file is for.
-   All functions should have a comment at the top of the function that describes what the function is for.
-   All variables should have a comment at the top of the variable that describes what the variable is for.
-   All classes should have a comment at the top of the class that describes what the class is for.
-   Inline comments should be used to explain why a particular line of code exists.
-   Docblocks should be used to describe the parameters and return values of a function.
-   All functions should be documented using JSDoc. Provide a description, parameters, and return values as a minimum. If it makes sense, also provide examples of how to use the function.
-   Events that are triggered (i.e. custom ones such as in a PubSub system) should be documented using JSDoc. Provide a description, and parameters.

## User Audience

To come.
