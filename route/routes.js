const router = require("express").Router();
const beritaRoute = require('../route/berita.route')
const morgan = require("morgan");

router.use(morgan("dev"));
router.use('/berita', beritaRoute )

module.exports = router;