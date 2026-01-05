class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String fullName;
  final String role;
  final String? avatar;
  final String? bio;
  final String? phone;
  final DateTime? dateOfBirth;
  final DateTime? createdAt;

  final int followersCount;
  final int followingCount;
  final int reachCount;
  final bool isVerified;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.role,
    this.avatar,
    this.bio,
    this.phone,
    this.dateOfBirth,
    this.createdAt,
    this.followersCount = 0,
    this.followingCount = 0,
    this.reachCount = 0,
    this.isVerified = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      fullName: json['fullName'] as String? ?? '${json['firstName']} ${json['lastName']}',
      role: json['role'] as String,
      avatar: json['avatar'] as String?,
      bio: json['bio'] as String?,
      phone: json['phone'] as String?,
      dateOfBirth: json['dateOfBirth'] != null 
          ? DateTime.parse(json['dateOfBirth'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      followersCount: json['followersCount'] as int? ?? 0,
      followingCount: json['followingCount'] as int? ?? 0,
      reachCount: json['reachCount'] as int? ?? 0,
      isVerified: json['isVerified'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'fullName': fullName,
      'role': role,
      'avatar': avatar,
      'bio': bio,
      'phone': phone,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'followersCount': followersCount,
      'followingCount': followingCount,
      'reachCount': reachCount,
      'isVerified': isVerified,
    };
  }
}

