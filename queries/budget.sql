SELECT
  ${type} as type,
  ${nameColumn^} as name,
  ${idColumn^} as id,
  SUM(adopted_budget_amount)::numeric as total
FROM (
  SELECT
    agencyname,
    agencyid,
    uoaname,
    uoaid,
    coalesce(responsibilitycenterid, 'unnamed') as responsibilitycenterid,
    coalesce(responsibilitycentername, 'Unnamed') as responsibilitycentername,
    budgetcodename,
    budgetcodeid,
    objectclassname,
    objectclassid,
    adopted_budget_amount
  FROM budget_opendata
  ${agencyPartial^}
  ${uoaPartial^}
  ${responsibilitycenterPartial^}
  ${budgetcodePartial^}
  AND publicationdate = '20180614'
) b
GROUP BY ${nameColumn^}, ${idColumn^}
ORDER BY total DESC
