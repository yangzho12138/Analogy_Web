<h3>Analogy Website designed for CS410 Text Information System MP3 at University of Illinois Urbana-Champaign (UIUC)</h3>

Frontend (React): Krishna Phani

Backend (Typescript + Express): Yang Zhou

**Structure of Backend Code:**

/apis/src/models: MongoDB Object Models

/apis/src/routes/\_\_test\_\_: test for some functional routes

/apis/src/routes/...Routes.ts: functional routes

/apis/src/test: test environment setup

/apis/src/utils: necessary util codes

/apis/src/app.ts: middlewares/routes declaration

/apis/src/index.ts: confirm env setting, conncet to the database, connect to the server port

/common: middlewares and error handlers

common code already packed into a NPM Package

```
npm i @analogy_web/common
```

use

```
npm start
```

in the apis folder to run the backend application

You could find more about this MP in the following link: https://docs.google.com/document/d/1FFNmufQVbrwcQYBo0y_17EGeCl31uoY5uo5MEIKv24o/edit?usp=sharing
