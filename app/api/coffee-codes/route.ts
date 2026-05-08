import { supabase } from '../../../lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const limit = searchParams.get('limit');

  let query = supabase
    .from('coffee_codes')
    .select('*');

  if (level) {
    query = query.eq('level', parseInt(level, 10));
  }

  // Fetch data and max level in parallel
  const [dataResult, maxLevelResult] = await Promise.all([
    query,
    supabase
      .from('coffee_codes')
      .select('level')
      .order('level', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (dataResult.error) {
    return Response.json(
      { error: dataResult.error.message },
      { status: 500 }
    );
  }

  const maxLevel = maxLevelResult.data?.level ?? 1;

  // Shuffle helper using Fisher-Yates algorithm
  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  let result;

  if (limit) {
    const limitNum = parseInt(limit, 10);

    // Group by category
    const grouped: Record<string, typeof dataResult.data> = {};
    for (const item of dataResult.data) {
      const cat = item.category || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const categories = Object.keys(grouped);
    const perCategory = Math.floor(limitNum / categories.length);
    const remainder = limitNum % categories.length;

    // Pick items equally from each category, fill shortfall from others
    const selected: typeof dataResult.data = [];
    const leftover: typeof dataResult.data = [];

    categories.forEach((cat, index) => {
      const count = perCategory + (index < remainder ? 1 : 0);
      const shuffledCat = shuffle(grouped[cat]);
      selected.push(...shuffledCat.slice(0, count));
      leftover.push(...shuffledCat.slice(count));
    });

    // If some categories had fewer items than allocated, fill from leftover
    if (selected.length < limitNum && leftover.length > 0) {
      const shuffledLeftover = shuffle(leftover);
      selected.push(...shuffledLeftover.slice(0, limitNum - selected.length));
    }

    result = shuffle(selected);
  } else {
    result = shuffle(dataResult.data);
  }

  return Response.json({ data: result, maxLevel });
}
