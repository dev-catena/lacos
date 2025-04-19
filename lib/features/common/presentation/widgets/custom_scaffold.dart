import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../home/presentation/widgets/components/icon_emergency_button.dart';

class CustomScaffold extends StatefulWidget {
  const CustomScaffold({
    super.key,
    this.showPatientNameOnScroll = true,
    required this.child,
    this.onRefresh,
    this.floatingActionButton,
    this.tabBar,
    this.isScrollable = true,
  });

  final Widget child;
  final bool showPatientNameOnScroll;
  final Widget? floatingActionButton;
  final TabBar? tabBar;
  final bool isScrollable;
  final void Function()? onRefresh;

  @override
  State<CustomScaffold> createState() => _CustomScaffoldState();
}

class _CustomScaffoldState extends State<CustomScaffold> {
  final ScrollController _scrollController = ScrollController();
  double _scrollPosition = 0;

  _scrollListener() {
    setState(() {
      _scrollPosition = _scrollController.position.pixels;
    });
  }

  @override
  void initState() {
    _scrollController.addListener(_scrollListener);
    super.initState();
  }

  String getTitle(BuildContext context) {
    final patient = context.read<UserCubit>().currentPatient;

    if (widget.showPatientNameOnScroll && _isScrolled) {
      return patient?.self.fullName.split(' ')[0] ?? '';
    } else {
      return 'Laços';
    }
  }

  bool get _isScrolled {
    return _scrollPosition > (kToolbarHeight + 20);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: widget.floatingActionButton,
      appBar: AppBar(
        bottom: widget.tabBar,
        title: Row(
          children: [
            _isScrolled
                ? const CircleAvatar(
                    backgroundImage: AssetImage('assets/images/senhora.webp'),
                  )
                : Image.asset('assets/images/lacos-ico.png'),
            const SizedBox(width: 12),
            BlocBuilder<UserCubit, UserState>(
              builder: (context, state) {
                return Text(getTitle(context));
              },
            ),
          ],
        ),
        actions: [
          if (_isScrolled) const IconEmergencyButton(),
          const SizedBox(width: 12),
          InkWell(
            onTap: () {
              if (GoRouter.of(context).state.name != AppRoutes.userProfileScreen) {
                context.push(AppRoutes.userProfileScreen);
              }
            },
            child: const CircleAvatar(
              backgroundImage: NetworkImage('https://thispersondoesnotexist.com/'),
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 8, top: 8),
        child: SafeArea(
          child: widget.isScrollable
              ? RefreshIndicator(
                  onRefresh: () async => widget.onRefresh,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    controller: _scrollController,
                    child: widget.child,
                  ),
                )
              : widget.child,
        ),
      ),
    );
  }
}

enum DropdownOptions {
  changeProfile('Trocar perfil de acesso', AppRoutes.groupSelectionScreen),
  logout('Logout', AppRoutes.groupSelectionScreen);

  final String description;
  final String route;

  const DropdownOptions(this.description, this.route);
}
