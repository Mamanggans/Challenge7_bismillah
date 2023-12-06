
require("dotenv").config();

const { validatePostUser } = require("./middleware/middleware"); 
const express = require("express");
const app = express();
const route = require("./route/routes");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;


import * as Sentry from "@sentry/node";
import express from "express";


const Sentry = require("@sentry/node");


Sentry.init({
  dsn: 'https://7c07740b45c2128ad45decea32294cc8@o4506321635180544.ingest.sentry.io/4506321639374848',
  tracesSampleRate: 1.0,
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());


app.get("/", function rootHandler(req, res) {
  res.end("Hello world!");
});

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "internal server error");
});

app.listen(3000);

app.use("/", route);

app.listen(port, () => {
  console.log(`website ini berjalan di port ${port}`);
});