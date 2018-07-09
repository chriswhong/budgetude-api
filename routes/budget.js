const express = require('express');
const router = express.Router();

// log the SQL query
const initOptions = {
  query(e) {
     (process.env.DEBUG === 'true') ? console.log(e.query) : null; // eslint-disable-line
  },
};

const pgp = require('pg-promise')(initOptions);

// initialize database connection
const db = pgp(process.env.DATABASE_CONNECTION_STRING);


/* GET / */
router.get('/', async (req, res) => {

  try {
    const data =
      await db.each(`
        SELECT
          'agency' as type,
          agencyname as name,
          agencyid as id,
          SUM(adopted_budget_amount)::numeric as total
        FROM budget_opendata
        WHERE publicationdate = '20180614'
        GROUP BY agencyname, agencyid
        ORDER BY total DESC
      `, [], (d) => { d.total = parseInt(d.total); });

    console.log(data[0])
    // send the response with a tile template
    res.send(data);
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid', async (req, res) => {
  const { agencyid } = req.params;

  try {
    const data =
      await db.each(`
        SELECT
          'uoa' as type,
          uoaname as name,
          uoaid as id,
          SUM(adopted_budget_amount)::numeric as total
        FROM budget_opendata
        WHERE agencyid = $1
        AND publicationdate = '20180614'
        GROUP BY uoaname, uoaid
        ORDER BY total DESC
      `, agencyid, (d) => { d.total = parseInt(d.total); });

    console.log(data[0])
    // send the response with a tile template
    res.send(data);
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid/uoa/:uoaid', async (req, res) => {
  const { agencyid, uoaid } = req.params;

  try {
    const data =
      await db.each(`
        SELECT
          'responsibilitycenter' as type,
          responsibilitycentername as name,
          responsibilitycenterid as id,
          SUM(adopted_budget_amount)::numeric as total
        FROM budget_opendata
        WHERE agencyid = $1
        AND uoaid = $2
        AND publicationdate = '20180614'
        GROUP BY responsibilitycentername, responsibilitycenterid
        ORDER BY total DESC
      `, [agencyid, uoaid], (d) => { d.total = parseInt(d.total); });

    console.log(data[0])
    // send the response with a tile template
    res.send(data);
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid/uoa/:uoaid/responsibilitycenter/:responsibilitycenterid', async (req, res) => {
  const { agencyid, uoaid, responsibilitycenterid } = req.params;
  console.log('rescenter', responsibilitycenterid)

  const responsibilitycenterWherePartial = (responsibilitycenterid === null) ? 'AND responsibilitycenterid = $3' : 'AND responsibilitycenterid IS NULL';

  try {
    const data =
      await db.each(`
        SELECT
          'budgetcode' as type,
          budgetcodename as name,
          budgetcodeid as id,
          SUM(adopted_budget_amount)::numeric as total
        FROM budget_opendata
        WHERE agencyid = $1
        AND uoaid = $2
        ${responsibilitycenterWherePartial}
        AND publicationdate = '20180614'
        GROUP BY budgetcodename, budgetcodeid
        ORDER BY total DESC
      `, [agencyid, uoaid, responsibilitycenterid], (d) => { d.total = parseInt(d.total); });

    console.log(data[0])
    // send the response with a tile template
    res.send(data);
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid/uoa/:uoaid/responsibilitycenter/:responsibilitycenterid/budgetcode/:budgetcodeid', async (req, res) => {
  const { agencyid, uoaid, responsibilitycenterid, budgetcodeid } = req.params;

  try {
    const data =
      await db.each(`
        SELECT
          'objectclass' as type,
          objectclassname as name,
          objectclassid as id,
          SUM(adopted_budget_amount)::numeric as total
        FROM budget_opendata
        WHERE agencyid = $1
        AND uoaid = $2
        AND responsibilitycenterid = $3
        AND budgetcodeid = $4
        AND publicationdate = '20180614'
        GROUP BY objectclassname, objectclassid
        ORDER BY total DESC
      `, [agencyid, uoaid, responsibilitycenterid, budgetcodeid], (d) => { d.total = parseInt(d.total); });

    console.log(data[0])
    // send the response with a tile template
    res.send(data);
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

module.exports = router;
