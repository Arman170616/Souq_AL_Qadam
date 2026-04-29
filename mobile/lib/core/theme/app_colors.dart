import 'package:flutter/material.dart';

class AppColors {
  // Backgrounds
  static const bg         = Color(0xFF0A0A1E);
  static const bgCard     = Color(0xFF12122A);
  static const bgSurface  = Color(0xFF1A1A35);

  // Primary palette
  static const indigo     = Color(0xFF6366F1);
  static const indigoDark = Color(0xFF4F46E5);
  static const pink       = Color(0xFFEC4899);
  static const amber      = Color(0xFFF59E0B);
  static const green      = Color(0xFF10B981);
  static const red        = Color(0xFFEF4444);
  static const purple     = Color(0xFF8B5CF6);

  // Text
  static const textPrimary   = Color(0xFFFFFFFF);
  static const textSecondary = Color(0x99FFFFFF);  // white/60
  static const textMuted     = Color(0x66FFFFFF);  // white/40
  static const textDisabled  = Color(0x33FFFFFF);  // white/20

  // Borders & glass
  static const glassBorder   = Color(0x1AFFFFFF);  // white/10
  static const glassOverlay  = Color(0x0DFFFFFF);  // white/5

  // Gradients
  static const List<Color> gradientPrimary = [Color(0xFF6366F1), Color(0xFF8B5CF6)];
  static const List<Color> gradientHero    = [Color(0xFF6366F1), Color(0xFFEC4899)];
  static const List<Color> gradientAmber   = [Color(0xFFF59E0B), Color(0xFFEF4444)];
}
