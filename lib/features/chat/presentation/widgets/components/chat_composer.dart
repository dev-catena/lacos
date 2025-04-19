import 'package:flutter/material.dart';

class ChatComposer extends StatefulWidget {
  final Function(String message) onSend;
  final Function()? onAttach;

  const ChatComposer({
    super.key,
    required this.onSend,
    this.onAttach,
  });

  @override
  ChatComposerState createState() => ChatComposerState();
}

class ChatComposerState extends State<ChatComposer> {
  final TextEditingController _controller = TextEditingController();

  void _sendMessage() {
    if (_controller.text.trim().isNotEmpty) {
      widget.onSend(_controller.text.trim());
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4),
        ],
      ),
      child: Row(
        children: [
          // Attachment Button
          IconButton(
            icon: const Icon(Icons.attach_file, color: Colors.grey),
            onPressed: widget.onAttach,
          ),
          // Text Field
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: const InputDecoration(
                hintText: 'Escreva sua mensagem',
                border: InputBorder.none,
              ),
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          // Send Button
          IconButton(
            icon: const Icon(
              Icons.send,
              // color: CustomColor.darkActiveOrange,
            ),
            onPressed: _sendMessage,
          ),
        ],
      ),
    );
  }
}