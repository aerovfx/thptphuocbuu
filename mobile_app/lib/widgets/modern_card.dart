import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ModernCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<String>? memberAvatars;
  final String? timeInfo;
  final int? itemCount;
  final Color? accentColor;
  final VoidCallback? onTap;
  final Widget? trailing;

  const ModernCard({
    super.key,
    required this.title,
    this.subtitle,
    this.memberAvatars,
    this.timeInfo,
    this.itemCount,
    this.accentColor,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = accentColor ?? theme.primaryColor;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Colored accent bar
            Container(
              width: 4,
              height: 80,
              decoration: BoxDecoration(
                color: accent,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                ),
              ),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: theme.textTheme.bodySmall?.color,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 12),
                    // Bottom row
                    Row(
                      children: [
                        // Member avatars
                        if (memberAvatars != null && memberAvatars!.isNotEmpty)
                          _buildAvatarStack(),
                        if (memberAvatars != null && memberAvatars!.isNotEmpty)
                          const SizedBox(width: 12),
                        // Time/Count info
                        Expanded(
                          child: Row(
                            children: [
                              if (timeInfo != null) ...[
                                Icon(
                                  Icons.access_time,
                                  size: 14,
                                  color: theme.textTheme.bodySmall?.color,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  timeInfo!,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: theme.textTheme.bodySmall?.color,
                                  ),
                                ),
                              ],
                              if (itemCount != null && timeInfo != null)
                                const SizedBox(width: 12),
                              if (itemCount != null) ...[
                                Icon(
                                  Icons.check_circle_outline,
                                  size: 14,
                                  color: accent,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '$itemCount',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: accent,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (trailing != null) trailing!,
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate()
      .fadeIn(duration: 300.ms)
      .slideX(begin: 0.1, end: 0, duration: 300.ms);
  }

  Widget _buildAvatarStack() {
    final maxVisible = 3;
    final visibleAvatars = memberAvatars!.take(maxVisible).toList();
    final remaining = memberAvatars!.length - maxVisible;

    return SizedBox(
      height: 24,
      width: (visibleAvatars.length * 16.0) + 8,
      child: Stack(
        children: [
          ...List.generate(visibleAvatars.length, (index) {
            return Positioned(
              left: index * 16.0,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                  image: DecorationImage(
                    image: NetworkImage(visibleAvatars[index]),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            );
          }),
          if (remaining > 0)
            Positioned(
              left: visibleAvatars.length * 16.0,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey[300],
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Text(
                    '+$remaining',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
