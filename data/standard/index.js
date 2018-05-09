const standards = {
  Section508: require('./Section508'),
  WCAG2A: require('./WCAG2A'),
  WCAG2AA: require('./WCAG2AA'),
  WCAG2AAA: require('./WCAG2AAA')
};

/**
 * Grabs the list of rules for the standard
 * @param standard
 * @return {{WCAGA, WCAGAA, WCAGAAA}}
 */
function getRules(standard) {
  return standards[standard];
}

/**
 * Builds object of each standard with its level of pass/error/ect
 * @param standard
 * @param results
 * @return {{}}
 */
function getRuleStatus(standard, results) {
  const rules = getRules(standard);

  const ruleObj = {};

  // Run through results
  results.forEach((result) => {
    // @TODO remove, now just using the straight values
    // pattern like:
    // WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputText.Name
    // want:
    // Principle4.Guideline4_1.4_1_2
    // .substring(
    //   result.code.indexOf('.') + 1,
    //     result.code.indexOf('.', result.code.lastIndexOf('_'))
    // );
    let baseRule = result.code.toLowerCase();
    const isFail = baseRule.lastIndexOf('.fail');
    // Strip off fail
    if (isFail !== -1) {
      baseRule = baseRule.substring(0, isFail);
    }

    // We want to set the "worst" of notice || warning || error ...
    if (ruleObj[baseRule] === 'error') {
      // Already error
      return;
    }

    if (!ruleObj[baseRule] || result.type !== 'notice') {
      ruleObj[baseRule] = result.type;
    }
  });

  // Run through list, pick up passed
  rules.forEach((rule) => {
    rule = rule.toLowerCase();
    if (!ruleObj[rule]) {
      ruleObj[rule] = 'pass';
    }
  });
  
  return ruleObj;
}

/**
 * Builds a rule-level count from the standard
 * @param standard
 * @param results
 * @return {*}
 */
function getRuleBasedCount(standard, results) {
  const status = getRuleStatus(standard, results);
  const statuses = Object.values(status);
  const passed = Object.keys(status).filter(rule => status[rule] === 'pass');
  return {
    passed: passed,
    count: {
      total: statuses.length,
      passed: passed.length,
      error: statuses.filter(status => status === 'error').length,
      warning: statuses.filter(status => status === 'warning').length,
      notice: statuses.filter(status => status === 'notice').length
    }
  };
}

module.exports = {
  getRules,
  getRuleStatus,
  getRuleBasedCount
}