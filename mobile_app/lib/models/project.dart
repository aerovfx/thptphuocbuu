class Project {
  final String id;
  final String title;
  final String? description;
  final int totalTasks;
  final int completedTasks;
  final int totalHours;
  final String? color;
  final List<ProjectMember> members;

  Project({
    required this.id,
    required this.title,
    this.description,
    required this.totalTasks,
    required this.completedTasks,
    required this.totalHours,
    this.color,
    this.members = const [],
  });

  double get progress {
    if (totalTasks == 0) return 0;
    return completedTasks / totalTasks;
  }

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      totalTasks: json['totalTasks'] as int,
      completedTasks: json['completedTasks'] as int,
      totalHours: json['totalHours'] as int,
      color: json['color'] as String?,
      members: (json['members'] as List<dynamic>?)
              ?.map((m) => ProjectMember.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'totalTasks': totalTasks,
      'completedTasks': completedTasks,
      'totalHours': totalHours,
      'color': color,
      'members': members.map((m) => m.toJson()).toList(),
    };
  }
}

class ProjectMember {
  final String id;
  final String name;
  final String? avatar;

  ProjectMember({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory ProjectMember.fromJson(Map<String, dynamic> json) {
    return ProjectMember(
      id: json['id'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
    };
  }
}
