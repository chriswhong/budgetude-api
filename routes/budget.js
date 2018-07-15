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
const budgetQuery = sql('../queries/budget.sql');
/* GET / */
router.get('/', async (req, res) => {
  try {
    const children =
      await db.each(budgetQuery, {
        type: 'agency',
        nameColumn: 'agencyname',
        idColumn: 'agencyid',
        agencyPartial: 'WHERE true',
        uoaPartial: '',
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: 0,
      name: 'New York City',
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
  console.log(agencyid, typeof(agencyid))

  try {
    const { agencyname } =
      await db.one(`SELECT agencyname FROM budget_opendata WHERE agencyid = '${agencyid}' LIMIT 1`);

    const children =
      await db.each(budgetQuery, {
        type: 'uoa',
        nameColumn: 'uoaname',
        idColumn: 'uoaid',
        agencyPartial: `WHERE agencyid = '${agencyid}'`,
        uoaPartial: '',
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: agencyid,
      name: agencyname,
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
    const { uoaname } =
      await db.one(`SELECT uoaname FROM budget_opendata WHERE agencyid = '${agencyid}' AND uoaid = '${uoaid}' LIMIT 1`);

    const children =
      await db.each(budgetQuery, {
        type: 'responsibilitycenter',
        nameColumn: 'responsibilitycentername',
        idColumn: 'responsibilitycenterid',
        agencyPartial: `WHERE agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial: '',
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    res.send({
      id: uoaid,
      name: uoaname,
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

    const children =
      await db.each(budgetQuery, {
        type: 'budgetcode',
        nameColumn: 'budgetcodename',
        idColumn: 'budgetcodeid',
        agencyPartial: `WHERE agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: '',
      }, (d) => { d.total = parseInt(d.total); });

    // send the response with a tile template
    res.send({
      id: responsibilitycenterid,
      name: responsibilitycentername,
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
    const { budgetcodename } =
      await db.one(`SELECT budgetcodename FROM budget_opendata WHERE agencyid = '${agencyid}' AND uoaid = '${uoaid}' ${responsibilitycenterPartial} AND budgetcodeid = '${budgetcodeid}' LIMIT 1`);

    const children =
      await db.each(budgetQuery, {
        type: 'objectclass',
        nameColumn: 'objectclassname',
        idColumn: 'objectclassid',
        agencyPartial: `WHERE agencyid = '${agencyid}'`,
        uoaPartial: `AND uoaid = '${uoaid}'`,
        responsibilitycenterPartial,
        budgetcodePartial: `AND budgetcodeid = '${budgetcodeid}'`,
      }, (d) => { d.total = parseInt(d.total); });

    res.send({
      id: budgetcodeid,
      name: budgetcodename,
      children,
    });
  } catch (e) {
    res.status(404).send({
      error: e.toString(),
    });
  }
});

module.exports = router;
