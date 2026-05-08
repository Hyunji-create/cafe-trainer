import { supabase } from '../../../lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

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

  // Shuffle using Fisher-Yates algorithm
  const shuffled = [...dataResult.data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return Response.json({ data: shuffled.slice(0, 1), maxLevel });
}
