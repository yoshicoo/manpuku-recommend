'use client';

import { useState } from 'react';
import { Search, Users, AlertTriangle, Truck } from 'lucide-react';
import { RecommendationRequest } from '@/types';

interface UserFormProps {
  onSubmit: (data: RecommendationRequest) => void;
  loading?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'meat', label: '肉類', emoji: '🥩' },
  { value: 'seafood', label: '魚介類', emoji: '🐟' },
  { value: 'fruit', label: '果物', emoji: '🍎' },
  { value: 'vegetable', label: '野菜', emoji: '🥬' },
  { value: 'rice', label: '米・穀物', emoji: '🌾' },
  { value: 'dairy', label: '乳製品', emoji: '🧀' },
  { value: 'alcohol', label: 'お酒', emoji: '🍶' },
  { value: 'sweets', label: 'スイーツ', emoji: '🍰' },
  { value: 'processed', label: '加工品', emoji: '🥫' },
  { value: 'set', label: 'セット・詰合せ', emoji: '📦' }
];

const ALLERGY_OPTIONS = [
  { value: 'egg', label: '卵' },
  { value: 'milk',
