SELECT
  coalesce(${nameColumn^}, 'Unnamed') as name,
  SUM(adopted_budget_amount)::numeric as total
FROM budget_opendata
WHERE
  ${agencyPartial^}
  ${uoaPartial^}
  ${responsibilitycenterPartial^}
  ${budgetcodePartial^}
AND publicationdate = '20180614'

GROUP BY ${nameColumn^}
