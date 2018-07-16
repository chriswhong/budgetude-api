const express = require('express');
const path = require('path');

const router = express.Router();

// log the SQL query
const initOptions = {
  query: (e) => {
    console.log(e.query);
  },
};

const pgp = require('pg-promise')(initOptions);


// initialize database connection
const db = pgp(process.env.DATABASE_CONNECTION_STRING);


// helper for linking to external query files:
function sql(file) {
  const fullPath = path.join(__dirname, file);
  return new pgp.QueryFile(fullPath, { minify: true });
}
// import sql query templates
const parentQuery = sql('../queries/parent.sql');
const budgetQuery = sql('../queries/budget.sql');
/* GET / */
router.get('/', async (req, res) => {
  try {
    const { total } = await db.one(`SELECT SUM(adopted_budget_amount)::numeric as total FROM budget_opendata WHERE publicationdate = '20180614'`)

    const children =
      await db.each(budgetQuery, {
        type: 'agency',
        nameColumn: 'agencyname',
        idColumn: 'agencyid',
        agencyPartial: 'true',
        uoaPartial: '',
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: 0,
      name: 'New York City',
      total,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid', async (req, res) => {
  const { agencyid } = req.params;

  try {
    const { name, total } =
      await db.one(parentQuery, {
        nameColumn: 'agencyname',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: '',
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      });

    const children =
      await db.each(budgetQuery, {
        type: 'uoa',
        nameColumn: 'uoaname',
        idColumn: 'uoaid',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: '',
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: agencyid,
      name,
      total,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid/uoa/:uoaid', async (req, res) => {
  const { agencyid, uoaid } = req.params;

  try {
    const { name, total } =
      await db.one(parentQuery, {
        nameColumn: 'uoaname',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      });

    const children =
      await db.each(budgetQuery, {
        type: 'responsibilitycenter',
        nameColumn: 'responsibilitycentername',
        idColumn: 'responsibilitycenterid',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    res.send({
      id: uoaid,
      name,
      total,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

const getResponsibilitycenterPartial = id => { // eslint-disable-line
  return (id !== 'unnamed') ? `AND responsibilitycenterid = '${id}'` : 'AND responsibilitycenterid IS NULL';
};

router.get('/agency/:agencyid/uoa/:uoaid/responsibilitycenter/:responsibilitycenterid', async (req, res) => {
  const { agencyid, uoaid, responsibilitycenterid } = req.params;
  const responsibilitycenterPartial = getResponsibilitycenterPartial(responsibilitycenterid);

  try {
    const { responsibilitycentername } =
      await db.one(`SELECT responsibilitycentername FROM budget_opendata WHERE agencyid = '${agencyid}' AND uoaid = '${uoaid}' ${responsibilitycenterPartial} LIMIT 1`);

    const { name, total } =
      await db.one(parentQuery, {
        nameColumn: 'responsibilitycentername',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: '',
      });

    const children =
      await db.each(budgetQuery, {
        type: 'budgetcode',
        nameColumn: 'budgetcodename',
        idColumn: 'budgetcodeid',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: responsibilitycenterid,
      name,
      total,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

router.get('/agency/:agencyid/uoa/:uoaid/responsibilitycenter/:responsibilitycenterid/budgetcode/:budgetcodeid', async (req, res) => {
  const { agencyid, uoaid, responsibilitycenterid, budgetcodeid } = req.params;
  const responsibilitycenterPartial = getResponsibilitycenterPartial(responsibilitycenterid);

  try {
    const { name, total } =
      await db.one(parentQuery, {
        nameColumn: 'budgetcodename',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: `AND budgetcodeid = '${budgetcodeid}'`,
      });

    const children =
      await db.each(budgetQuery, {
        type: 'objectclass',
        nameColumn: 'objectclassname',
        idColumn: 'objectclassid',
        agencyPartial: `agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: `AND budgetcodeid = '${budgetcodeid}'`,
      }, (d) => { d.total = parseInt(d.total); });

    res.send({
      id: budgetcodeid,
      name,
      total,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

module.exports = router;
