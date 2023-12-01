const { ResponseTemplate } = require("../helper/template.helper");
const Joi = require("joi");

function validatePostUser(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().alphanum().max(255).required(),
    description: Joi.string().alphanum().max(255).required(),
    url_img: Joi.string().max(255),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const respErr = ResponseTemplate(
      null,
      "Invalid request",
      error.details[0].message,
      400
    );
    return res.json(respErr);
  }

  next();
}

module.exports = {
  validatePostUser,
};