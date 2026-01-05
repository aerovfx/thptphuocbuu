// Basic Flutter widget test for PhuocBuu Mobile App
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phuocbuu_mobile/main.dart';

void main() {
  testWidgets('App initializes correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());
    
    // Pump a few frames to allow async initialization
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify that the app builds without errors
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
