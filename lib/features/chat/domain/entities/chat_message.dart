import 'package:flutter/material.dart';
import '../../../../core/utils/date_parser.dart';

import '../../../../core/utils/custom_colors.dart';
import '../../../common/domain/entities/user.dart';

class MessageData {
  final int id;
  final User author;
  final String message;
  final DateTime dateTime;

  MessageData({
    required this.id,
    required this.author,
    required this.message,
    required this.dateTime,
  });

  ChatMessageWidget buildMessageWidget() {
    return ChatMessageWidget(this);
  }
}

class ChatMessageWidget extends StatelessWidget {
  const ChatMessageWidget(this.message, {super.key});

  final MessageData message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            child: Image.asset(message.author.photoPath),
          ),
          const SizedBox(width: 10),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: CustomColor.activeBottomBarBgIcon,
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                      bottomRight: Radius.circular(12),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.author.fullName,
                        textAlign: TextAlign.start,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 8, bottom: 4),
                        child: Text(
                          message.message,
                          style: const TextStyle(color: Colors.black),
                        ),
                      ),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Text(
                          DateParser.formatDate(message.dateTime, true),
                          textAlign: TextAlign.end,
                          style: const TextStyle(color: Colors.black54),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
