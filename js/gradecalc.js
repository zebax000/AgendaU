'use strict';

class GradeCalculator {
  static PASSING = 3;
  static MAX_SCORE = 5;
  static BLOCKS = [
    { id: 'corte1', label: 'Primer corte', weight: 35 },
    { id: 'corte2', label: 'Segundo corte', weight: 40 },
    { id: 'final', label: 'Final', weight: 25 }
  ];

  static round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  static ceilTenth(value) {
    return Math.ceil(GradeCalculator.round(value * 10, 6)) / 10;
  }

  static getBlock(id) {
    return GradeCalculator.BLOCKS.find((block) => block.id === id);
  }

  static pointsOf(grade) {
    return (grade.score * grade.weight) / 100;
  }

  static usedWeight(grades, blockId, excludeId = null) {
    const total = grades
      .filter((grade) => grade.block === blockId && grade.id !== excludeId)
      .reduce((sum, grade) => sum + grade.weight, 0);
    return GradeCalculator.round(total);
  }

  static summarizeBlock(block, grades) {
    const own = grades.filter((grade) => grade.block === block.id);
    const registered = GradeCalculator.usedWeight(grades, block.id);
    const points = own.reduce((sum, grade) => sum + GradeCalculator.pointsOf(grade), 0);
    const maxPoints = (GradeCalculator.MAX_SCORE * block.weight) / 100;
    return {
      ...block,
      grades: own,
      registered,
      points,
      maxPoints,
      score: points / (block.weight / 100),
      complete: registered >= block.weight
    };
  }

  static neededInFinal(blocks) {
    const final = blocks.find((block) => block.id === 'final');
    if (final.registered > 0) return null;
    const others = blocks
      .filter((block) => block.id !== 'final')
      .reduce((sum, block) => sum + block.points, 0);
    const needed = (GradeCalculator.PASSING - others) / (final.weight / 100);
    return {
      needed: Math.max(0, GradeCalculator.ceilTenth(needed)),
      reachable: needed <= GradeCalculator.MAX_SCORE
    };
  }

  static neededInCuts(blocks) {
    const cuts = blocks.filter((block) => block.id !== 'final');
    const weight = cuts.reduce((sum, block) => sum + block.weight, 0);
    const registered = GradeCalculator.round(cuts.reduce((sum, block) => sum + block.registered, 0));
    const points = cuts.reduce((sum, block) => sum + block.points, 0);
    const remaining = GradeCalculator.round(weight - registered);
    if (remaining <= 0) return null;

    const needed = (GradeCalculator.PASSING - points) / (remaining / 100);
    return {
      weight,
      remaining,
      needed: Math.max(0, GradeCalculator.ceilTenth(needed)),
      reachable: needed <= GradeCalculator.MAX_SCORE
    };
  }

  static analyze(grades) {
    const { PASSING, MAX_SCORE } = GradeCalculator;
    const blocks = GradeCalculator.BLOCKS.map((block) => GradeCalculator.summarizeBlock(block, grades));
    const registered = GradeCalculator.round(blocks.reduce((sum, block) => sum + block.registered, 0));
    const points = blocks.reduce((sum, block) => sum + block.points, 0);
    const remainingWeight = GradeCalculator.round(100 - registered);
    const maxPossible = points + (remainingWeight * MAX_SCORE) / 100;

    let status = 'possible';
    if (points >= PASSING) status = 'passed';
    else if (maxPossible < PASSING) status = 'impossible';

    const missingPoints = Math.max(0, PASSING - points);
    return {
      hasData: grades.length > 0,
      blocks,
      registered,
      remainingWeight,
      points,
      maxPossible,
      status,
      cutsWeight: blocks.filter((block) => block.id !== 'final').reduce((sum, block) => sum + block.weight, 0),
      neededOnRemaining:
        status === 'possible' ? GradeCalculator.ceilTenth(missingPoints / (remainingWeight / 100)) : null,
      neededInCuts: GradeCalculator.neededInCuts(blocks),
      neededInFinal: GradeCalculator.neededInFinal(blocks)
    };
  }

  static quick(entries) {
    const { PASSING, MAX_SCORE } = GradeCalculator;
    const registered = GradeCalculator.round(entries.reduce((sum, entry) => sum + entry.percent, 0));
    const points = entries.reduce((sum, entry) => sum + (entry.score * entry.percent) / 100, 0);
    const remaining = GradeCalculator.round(100 - registered);
    const maxPossible = points + (remaining * MAX_SCORE) / 100;
    const base = { registered, remaining, points, maxPossible };

    if (remaining < 0) return { ...base, status: 'invalid' };
    if (points >= PASSING) return { ...base, status: 'passed' };
    if (remaining === 0 || maxPossible < PASSING) return { ...base, status: 'impossible' };

    const needed = GradeCalculator.ceilTenth((PASSING - points) / (remaining / 100));
    return { ...base, status: 'possible', needed };
  }
}
