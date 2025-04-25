import 'package:flutter/material.dart';
import '../../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../components/chat_composer.dart';
import '../../../../common/domain/entities/user.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../domain/entities/chat_message.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      isScrollable: false,
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _MockData().messages.length,
              itemBuilder: (context, index) {
                final message = _MockData().messages[index];

                return message.buildMessageWidget();
              },
            ),
          ),
          ChatComposer(
            onSend: (message) {},
          ),
        ],
      ),
    );
  }
}

class _MockData {
  final messages = [
    MessageData(
      id: 1,
      author: UserEntity(
        id: 1,
        fullName: 'Juliana Moreira',
        photoPath: 'assets/images/senhora.webp',
        isPatient: false,
        accessProfileTypes: [AccessProfileType.companion],
      ),
      dateTime: DateTime.now(),
      message:
          'Alguém sabe se ela já acordou? Gostaria muito dessa informação, pois tenho algumas notícias para dar a ela',
    ),
  ];
}
