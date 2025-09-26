function compareSitesData(freshSiteData, siteData) {
  const siteDataMap = new Map(
    siteData.map((site) => [site.site_key, site.site_name])
  );

  const freshSiteMap = new Map(
    freshSiteData.map((site) => [site.site_key, site.name])
  );

  const removed = siteData
    .filter((site) => !freshSiteMap.has(site.site_key))
    .map((site) => site.site_key);

  const added = freshSiteData
    .filter((site) => !siteDataMap.has(site.site_key))
    .map((site) => ({
      site_name: site.name,
      site_key: site.site_key,
    }));

  return { removed, added };
}

module.exports = { compareSitesData };
